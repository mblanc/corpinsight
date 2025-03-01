export interface SearchResult {
  text: string
  chunks:  {
    uri: string,
    title: string,
  }[]
  searchEntryPoint: string
}