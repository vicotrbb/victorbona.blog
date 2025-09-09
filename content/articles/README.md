# Articles Content

This directory contains academic articles and papers in LaTeX format.

## Adding Articles

To add a new article:

1. Create a new subdirectory with your article slug: `your-article-title/`
2. Add your LaTeX source file: `your-article-title.tex`
3. Add bibliography file if needed: `your-article-title.bib`
4. Update the articles data in `/app/articles/articles.ts`

## Structure

```
content/articles/
├── article-slug/
│   ├── article-title.tex
│   └── article-title.bib (optional)
└── another-article/
    └── another-article.tex
```

## Supported Files

- `.tex` - LaTeX source files
- `.bib` - Bibliography files (optional)