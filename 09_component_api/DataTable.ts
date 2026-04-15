export type DataTableProps<T> = {
  data: T[]
  onRowClick: (row: T) => void
}