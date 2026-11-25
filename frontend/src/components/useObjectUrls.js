import { useEffect, useMemo } from 'react'

/** Preview URLs for picked files, revoked when the files change or the form unmounts. */
export default function useObjectUrls(files) {
  const urls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files])
  useEffect(() => () => urls.forEach(URL.revokeObjectURL), [urls])
  return urls
}
