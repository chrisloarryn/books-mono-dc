import axios from 'axios';

export interface OpenLibraryDoc {
  key: string; // work key like "/works/OL12345W"
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
}

export interface SearchResultItem {
  workKey: string;
  title: string;
  authors: string[];
  year?: number;
  openLibraryCoverUrl?: string;
}

export async function searchBooksRaw(q: string): Promise<OpenLibraryDoc[]> {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}`;
  const { data } = await axios.get(url, { timeout: 10000 });

  console.log(`[OpenLibrary] Search results for "${q}":`, data?.numFound || 0, 'items');

  return (data?.docs || []).slice(0, 10);
}

export function mapDocsToItems(docs: OpenLibraryDoc[]): SearchResultItem[] {
  return docs.map((d) => {
    const coverUrl = d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : undefined;
    return {
      workKey: d.key,
      title: d.title,
      authors: Array.isArray(d.author_name) ? d.author_name : [],
      year: d.first_publish_year,
      openLibraryCoverUrl: coverUrl,
    };
  });
}
