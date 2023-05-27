import { danger, info } from "./../shared/cli.mjs";

const ResponsiveImageAttributes = `fragment ResponsiveImageAttributes on ResponsiveImage {
  src
  width
  height
  alt
  title
  base64
  bgColor
  sizes
}`;
const SeoAttributes = `fragment SeoAttributes on SeoField {
  description
  title
  twitterCard
  image {
    responsiveImage {
      ...ResponsiveImageAttributes
    }
  }
}`;

const TagAttributes = `fragment TagAttributes on TagRecord {
  id
  title
}`;

const PostAttributes = `fragment PostAttributes on PostRecord {
  id
  title
  image {
    responsiveImage(imgixParams: {w: 690, crop: faces}) {
      ...ResponsiveImageAttributes
    }
  }
  publishedAt: _firstPublishedAt
  slug
  content
  slug
  tags {
    ...TagAttributes
  }
  seo {
    ...SeoAttributes
  }
}`;

const SiteAttributes = `fragment SiteAttributes on Site {
  favicon {
    responsiveImage(imgixParams: {w: 64, h: 64, crop: focalpoint}) {
      src
    }
  }
  globalSeo {
    facebookPageUrl
    siteName
    titleSuffix
    twitterAccount
    fallbackSeo {
      ...SeoAttributes
    }
  }
}`;

export const getModels = async () => {
  info("Downloading models from Dato...");
  const query = `
  ${PostAttributes}
  ${ResponsiveImageAttributes}
  ${SeoAttributes}
  ${SiteAttributes}
  ${TagAttributes}
  {
    posts: allPosts(first: 100) {
      ...PostAttributes
    }
    site: _site {
      ...SiteAttributes
    }
  }
  `;

  return await request({ query });
};

const request = async ({ query }) => {
  try {
    const response = await fetch("https://graphql.datocms.com/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${process.env.DATO_API_TOKEN}`,
      },
      body: JSON.stringify({
        query,
      }),
    });

    const json = await response.json();
    return json.data;
  } catch (error) {
    danger(error.data);

    return null;
  }
};
