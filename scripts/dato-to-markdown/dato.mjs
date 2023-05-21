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
  return {
    posts: [
      {
        id: "116306000",
        title: "Test Post 1",
        image: {
          responsiveImage: {
            src: "https://www.datocms-assets.com/101601/1684691116-2400x1400.png?crop=faces&w=690",
            width: 690,
            height: 402,
            alt: null,
            title: null,
            base64:
              "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAoHBwgHBgoICAgFCgoFBQwFBQUFBREJCgUMFxMZGBYTFhUaHysjGh0oHRUWJDUlKC0vMjIyGSI4PTcwPCsxMi8BCgsLBQUFEAUFEC8cFhwvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL//AABEIAA4AGAMBIgACEQEDEQH/xAAVAAEBAAAAAAAAAAAAAAAAAAAABv/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAVAQEBAAAAAAAAAAAAAAAAAAACAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/ALwARAEn/9k=",
            bgColor: "#cccccc",
            sizes: "(max-width: 690px) 100vw, 690px",
          },
        },
        publishedAt: "2023-05-21T18:43:16+01:00",
        slug: "test-post-1",
        content: "## h2\n\n* Some content\n* Some more content",
        tags: [],
        seo: null,
      },
      {
        id: "116306016",
        title: "Test Post 8",
        image: {
          responsiveImage: {
            src: "https://www.datocms-assets.com/101601/1684691116-2400x1400.png?crop=faces&w=690",
            width: 690,
            height: 402,
            alt: null,
            title: null,
            base64:
              "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAoHBwgHBgoICAgFCgoFBQwFBQUFBREJCgUMFxMZGBYTFhUaHysjGh0oHRUWJDUlKC0vMjIyGSI4PTcwPCsxMi8BCgsLBQUFEAUFEC8cFhwvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL//AABEIAA4AGAMBIgACEQEDEQH/xAAVAAEBAAAAAAAAAAAAAAAAAAAABv/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAVAQEBAAAAAAAAAAAAAAAAAAACAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/ALwARAEn/9k=",
            bgColor: "#cccccc",
            sizes: "(max-width: 690px) 100vw, 690px",
          },
        },
        publishedAt: "2023-05-21T18:48:00+01:00",
        slug: "test-post-8",
        content: "Some content",
        tags: [{ id: "116306017", title: "Front End" }],
        seo: null,
      },
      {
        id: "116306015",
        title: "Test Post  7",
        image: {
          responsiveImage: {
            src: "https://www.datocms-assets.com/101601/1684691116-2400x1400.png?crop=faces&w=690",
            width: 690,
            height: 402,
            alt: null,
            title: null,
            base64:
              "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAoHBwgHBgoICAgFCgoFBQwFBQUFBREJCgUMFxMZGBYTFhUaHysjGh0oHRUWJDUlKC0vMjIyGSI4PTcwPCsxMi8BCgsLBQUFEAUFEC8cFhwvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL//AABEIAA4AGAMBIgACEQEDEQH/xAAVAAEBAAAAAAAAAAAAAAAAAAAABv/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAVAQEBAAAAAAAAAAAAAAAAAAACAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/ALwARAEn/9k=",
            bgColor: "#cccccc",
            sizes: "(max-width: 690px) 100vw, 690px",
          },
        },
        publishedAt: "2023-05-21T18:48:00+01:00",
        slug: "test-post-7",
        content: "Some content",
        tags: [],
        seo: null,
      },
      {
        id: "116306014",
        title: "Test Post 6",
        image: {
          responsiveImage: {
            src: "https://www.datocms-assets.com/101601/1684691116-2400x1400.png?crop=faces&w=690",
            width: 690,
            height: 402,
            alt: null,
            title: null,
            base64:
              "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAoHBwgHBgoICAgFCgoFBQwFBQUFBREJCgUMFxMZGBYTFhUaHysjGh0oHRUWJDUlKC0vMjIyGSI4PTcwPCsxMi8BCgsLBQUFEAUFEC8cFhwvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL//AABEIAA4AGAMBIgACEQEDEQH/xAAVAAEBAAAAAAAAAAAAAAAAAAAABv/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAVAQEBAAAAAAAAAAAAAAAAAAACAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/ALwARAEn/9k=",
            bgColor: "#cccccc",
            sizes: "(max-width: 690px) 100vw, 690px",
          },
        },
        publishedAt: "2023-05-21T18:48:00+01:00",
        slug: "test-post-6",
        content: "Some content",
        tags: [{ id: "116306017", title: "Front End" }],
        seo: null,
      },
      {
        id: "116306013",
        title: "Test Post 5",
        image: {
          responsiveImage: {
            src: "https://www.datocms-assets.com/101601/1684691116-2400x1400.png?crop=faces&w=690",
            width: 690,
            height: 402,
            alt: null,
            title: null,
            base64:
              "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAoHBwgHBgoICAgFCgoFBQwFBQUFBREJCgUMFxMZGBYTFhUaHysjGh0oHRUWJDUlKC0vMjIyGSI4PTcwPCsxMi8BCgsLBQUFEAUFEC8cFhwvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL//AABEIAA4AGAMBIgACEQEDEQH/xAAVAAEBAAAAAAAAAAAAAAAAAAAABv/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAVAQEBAAAAAAAAAAAAAAAAAAACAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/ALwARAEn/9k=",
            bgColor: "#cccccc",
            sizes: "(max-width: 690px) 100vw, 690px",
          },
        },
        publishedAt: "2023-05-21T18:48:00+01:00",
        slug: "test-post-5",
        content: "Some content",
        tags: [],
        seo: null,
      },
      {
        id: "116306012",
        title: "Test Post 4",
        image: {
          responsiveImage: {
            src: "https://www.datocms-assets.com/101601/1684691116-2400x1400.png?crop=faces&w=690",
            width: 690,
            height: 402,
            alt: null,
            title: null,
            base64:
              "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAoHBwgHBgoICAgFCgoFBQwFBQUFBREJCgUMFxMZGBYTFhUaHysjGh0oHRUWJDUlKC0vMjIyGSI4PTcwPCsxMi8BCgsLBQUFEAUFEC8cFhwvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL//AABEIAA4AGAMBIgACEQEDEQH/xAAVAAEBAAAAAAAAAAAAAAAAAAAABv/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAVAQEBAAAAAAAAAAAAAAAAAAACAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/ALwARAEn/9k=",
            bgColor: "#cccccc",
            sizes: "(max-width: 690px) 100vw, 690px",
          },
        },
        publishedAt: "2023-05-21T18:48:00+01:00",
        slug: "test-post-4",
        content: "Some content",
        tags: [],
        seo: null,
      },
      {
        id: "116306010",
        title: "Test Post 2",
        image: {
          responsiveImage: {
            src: "https://www.datocms-assets.com/101601/1684691116-2400x1400.png?crop=faces&w=690",
            width: 690,
            height: 402,
            alt: null,
            title: null,
            base64:
              "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAoHBwgHBgoICAgFCgoFBQwFBQUFBREJCgUMFxMZGBYTFhUaHysjGh0oHRUWJDUlKC0vMjIyGSI4PTcwPCsxMi8BCgsLBQUFEAUFEC8cFhwvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL//AABEIAA4AGAMBIgACEQEDEQH/xAAVAAEBAAAAAAAAAAAAAAAAAAAABv/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAVAQEBAAAAAAAAAAAAAAAAAAACAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/ALwARAEn/9k=",
            bgColor: "#cccccc",
            sizes: "(max-width: 690px) 100vw, 690px",
          },
        },
        publishedAt: "2023-05-21T18:48:00+01:00",
        slug: "test-post-2",
        content: "Some content",
        tags: [{ id: "116306017", title: "Front End" }],
        seo: null,
      },
      {
        id: "116306011",
        title: "Test Post 3",
        image: {
          responsiveImage: {
            src: "https://www.datocms-assets.com/101601/1684691116-2400x1400.png?crop=faces&w=690",
            width: 690,
            height: 402,
            alt: null,
            title: null,
            base64:
              "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAoHBwgHBgoICAgFCgoFBQwFBQUFBREJCgUMFxMZGBYTFhUaHysjGh0oHRUWJDUlKC0vMjIyGSI4PTcwPCsxMi8BCgsLBQUFEAUFEC8cFhwvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL//AABEIAA4AGAMBIgACEQEDEQH/xAAVAAEBAAAAAAAAAAAAAAAAAAAABv/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAVAQEBAAAAAAAAAAAAAAAAAAACAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/ALwARAEn/9k=",
            bgColor: "#cccccc",
            sizes: "(max-width: 690px) 100vw, 690px",
          },
        },
        publishedAt: "2023-05-21T18:48:00+01:00",
        slug: "test-post-3",
        content: "Some content",
        tags: [{ id: "116306017", title: "Front End" }],
        seo: null,
      },
    ],
    site: {
      favicon: {
        responsiveImage: {
          src: "https://www.datocms-assets.com/101601/1684694095-favicon-5.png?crop=focalpoint&h=64&w=64",
        },
      },
      globalSeo: {
        facebookPageUrl: null,
        siteName: "Dan Holloran",
        titleSuffix: "- Dan Holloran",
        twitterAccount: "@dholloran",
        fallbackSeo: {
          description:
            "I'm a Full Stack Developer and Photographer based in St. Louis. I love traveling and enjoy mentoring others. Let's create something amazing together!",
          title: "Dan Holloran",
          twitterCard: "summary_large_image",
          image: null,
        },
      },
    },
  };
  // const query = `
  // ${PostAttributes}
  // ${ResponsiveImageAttributes}
  // ${SeoAttributes}
  // ${SiteAttributes}
  // ${TagAttributes}
  // {
  //   posts: allPosts(first: 100) {
  //     ...PostAttributes
  //   }
  //   site: _site {
  //     ...SiteAttributes
  //   }
  // }
  // `;

  // return await request({ query });
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
    console.log(error.data);

    return null;
  }
};
