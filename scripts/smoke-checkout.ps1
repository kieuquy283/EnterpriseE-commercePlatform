param(
  [string]$BaseUrl = "http://127.0.0.1:9000",
  [string]$PublishableKey = $env:PUBLISHABLE_KEY,
  [switch]$RegisterCustomer
)

$ErrorActionPreference = "Stop"
if (-not $BaseUrl.StartsWith("http://127.0.0.1:") -and -not $BaseUrl.StartsWith("http://localhost:")) {
  throw "This smoke test creates an order and only accepts a local BaseUrl."
}
if (-not $PublishableKey -or -not $PublishableKey.StartsWith("pk_")) {
  throw "Set PUBLISHABLE_KEY to a local publishable API key."
}

$headers = @{ "x-publishable-api-key" = $PublishableKey }
function Request([string]$Method, [string]$Path, $Data = $null) {
  $arguments = @{
    Method = $Method
    Uri = "$BaseUrl$Path"
    Headers = $headers
  }
  if ($null -ne $Data) {
    $arguments.ContentType = "application/json"
    $arguments.Body = ConvertTo-Json -InputObject $Data -Depth 10 -Compress
  }
  return Invoke-RestMethod @arguments
}

$health = (Invoke-WebRequest -UseBasicParsing "$BaseUrl/health").StatusCode
if ($health -ne 200) { throw "Medusa health returned $health" }

$email = "smoke-$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())@example.test"
if ($RegisterCustomer) {
  $password = [Guid]::NewGuid().ToString("N") + "aA1!"
  $registration = Request "POST" "/auth/customer/emailpass/register" @{
    email = $email
    password = $password
  }
  if (-not $registration.token) { throw "Customer registration token missing" }
  $headers.Authorization = "Bearer $($registration.token)"
  $customer = Request "POST" "/store/customers" @{
    email = $email
    first_name = "Smoke"
    last_name = "User"
  }
  if (-not $customer.customer.id) { throw "Customer creation failed" }
  $login = Request "POST" "/auth/customer/emailpass" @{
    email = $email
    password = $password
  }
  if (-not $login.token) { throw "Customer login token missing" }
  $headers.Authorization = "Bearer $($login.token)"
  $me = Request "GET" "/store/customers/me"
  if ($me.customer.email -ne $email) { throw "Customer login did not match registered account" }
}

$region = (Request "GET" "/store/regions").regions | Where-Object { $_.name -eq "Vietnam" } | Select-Object -First 1
if (-not $region) { throw "Vietnam region not found" }

$product = (Request "GET" "/store/products?handle=ao-thun-essential&region_id=$($region.id)").products | Select-Object -First 1
$variant = $product.variants | Select-Object -First 1
if (-not $variant) { throw "Seed product variant not found" }

$cart = (Request "POST" "/store/carts" @{ region_id = $region.id }).cart
Request "POST" "/store/carts/$($cart.id)/line-items" @{ variant_id = $variant.id; quantity = 1 } | Out-Null

$address = @{
  first_name = "Smoke"
  last_name = "Test"
  address_1 = "1 Test Street"
  city = "Ho Chi Minh City"
  postal_code = "700000"
  country_code = "vn"
  phone = "+84900000000"
}
Request "POST" "/store/carts/$($cart.id)" @{
  email = $email
  shipping_address = $address
  billing_address = $address
} | Out-Null

$shippingOption = (Request "GET" "/store/shipping-options?cart_id=$($cart.id)").shipping_options | Select-Object -First 1
if (-not $shippingOption) { throw "No shipping option is available" }
Request "POST" "/store/carts/$($cart.id)/shipping-methods" @{ option_id = $shippingOption.id } | Out-Null

$paymentProviders = (Request "GET" "/store/payment-providers?region_id=$($region.id)").payment_providers
if (-not ($paymentProviders | Where-Object { $_.id -eq "pp_system_default" })) {
  throw "Manual payment provider is unavailable"
}
$collection = (Request "POST" "/store/payment-collections" @{ cart_id = $cart.id }).payment_collection
Request "POST" "/store/payment-collections/$($collection.id)/payment-sessions" @{ provider_id = "pp_system_default" } | Out-Null

$completion = Request "POST" "/store/carts/$($cart.id)/complete" @{}
if ($completion.type -ne "order" -or -not $completion.order.id) {
  throw "Cart did not complete as an order: $($completion.error.message)"
}

if ($RegisterCustomer) {
  $orders = (Request "GET" "/store/orders?limit=20").orders
  if (-not ($orders | Where-Object { $_.id -eq $completion.order.id })) {
    throw "Completed order is missing from customer order history"
  }
}

Write-Output "PASS health=200 product=$($product.handle) cart=$($cart.id) order=$($completion.order.id) registered=$($RegisterCustomer.IsPresent) history=$($RegisterCustomer.IsPresent) email=$email"
