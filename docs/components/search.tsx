'use client'
import {
  SearchDialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogOverlay,
  type SharedProps
} from 'fumadocs-ui/components/dialog/search'
import { useStaticSearch } from 'fumadocs-core/search/client'

// Loads the index exported to /api/search at build time; no search server is needed.
export default function StaticSearchDialog(props: SharedProps) {
  const search = useStaticSearch()

  return (
    <SearchDialog {...search} {...props}>
      <SearchDialogOverlay />
      <SearchDialogContent>
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput />
          <SearchDialogClose />
        </SearchDialogHeader>
        <SearchDialogList />
      </SearchDialogContent>
    </SearchDialog>
  )
}
