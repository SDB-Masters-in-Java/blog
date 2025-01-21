# SDB Tech Blog
> Blog posts of SDB Professionals' employees

## Setup
The blog is set up to be hosted on [GitHub pages](https://pages.github.com/), using a static site generator called [Jekyll](https://jekyllrb.com/).

## Hosting
When new commits are pushed to the `main` branch, they are automatically published.
Note that blog posts in the `_drafts` are not published.

## Writing locally

### Work on a draft
Create a blog post file in the `_drafts` folder and add the appropriate _frontmatter_ to the post.
You can use this template file, `first-post.md`:

```markdown
---
title:  "A first Java Blogpost"
categories: java
---

## My first Java Blog
Lorem ipsum dolor sit amet...
```

### View the rendered post

Execute to run Jekyll with drafts and livereload enabled in a docker container:
```shell
docker run --rm \
  --volume="$PWD:/srv/jekyll:Z" \
  --publish 4000:4000 --publish 35729:35729 \
  jekyll/jekyll \
  jekyll serve --draft --livereload
```

Now you should be able to view the site at [localhost:4000](http://localhost:4000)

### Publishing a post

Copy the draft you want to publish from the `_drafts` folder to the `_posts` folder and use the naming convention: `YEAR-MONTH-DAY-title.md`.
And of course, push to GitHub