import LocalizedClientLink from "@modules/common/components/localized-client-link"

const Hero = () => {
  return (
    <section className="border-b border-ui-border-base bg-ui-bg-subtle">
      <div className="content-container flex flex-col items-start gap-5 py-12 small:py-16">
        <p className="text-small-semi uppercase tracking-widest text-ui-fg-subtle">
          DAYMARK
        </p>
        <h1 className="max-w-2xl text-3xl-semi small:text-4xl-semi">
          Made for the everyday.
        </h1>
        <p className="max-w-xl text-base-regular text-ui-fg-subtle">
          Versatile clothing for study, work and wherever the day takes you.
        </p>
        <LocalizedClientLink
          href="/store"
          className="rounded bg-ui-button-inverted px-5 py-3 text-ui-fg-on-color hover:bg-ui-button-inverted-hover"
        >
          Shop all products
        </LocalizedClientLink>
      </div>
    </section>
  )
}

export default Hero
