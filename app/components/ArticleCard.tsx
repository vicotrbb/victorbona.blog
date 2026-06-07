import type { Article } from "app/articles/articles";
import { PaperRow } from "./PaperRow";

export function ArticleCard({ article }: { article: Article }) {
  return <PaperRow article={article} />;
}
