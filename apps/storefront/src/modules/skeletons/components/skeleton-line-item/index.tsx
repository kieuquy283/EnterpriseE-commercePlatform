import { Table } from "@modules/common/components/ui"

const SkeletonLineItem = () => {
  return (
    <Table.Row className="w-full" aria-hidden="true">
      <Table.Cell className="!pl-0 px-0 py-6">
        <div className="dm-skeleton aspect-[3/4] w-16" />
      </Table.Cell>
      <Table.Cell className="px-0 text-left">
        <div className="flex flex-col gap-y-2">
          <div className="dm-skeleton h-3.5 w-40" />
          <div className="dm-skeleton h-3 w-24" />
        </div>
      </Table.Cell>
      <Table.Cell className="px-0">
        <div className="flex items-center gap-3">
          <div className="dm-skeleton h-11 w-20" />
          <div className="dm-skeleton h-3 w-16" />
        </div>
      </Table.Cell>
      <Table.Cell className="px-0">
        <div className="dm-skeleton h-3.5 w-16" />
      </Table.Cell>
      <Table.Cell className="!pr-0 px-0">
        <div className="flex justify-end">
          <div className="dm-skeleton h-3.5 w-16" />
        </div>
      </Table.Cell>
    </Table.Row>
  )
}

export default SkeletonLineItem
