import useWebhookPoster from "./../../../src/composables/useWebhookPoster.js";

export default async (req, _context) => {
  const error404Response = new Response("Function not found...", {
    status: 404,
    statusText: "Not Found",
  });

  if (req.method !== "POST") {
    return error404Response;
  }

  let body = req?.body
    ? JSON.parse(
        Buffer.from((await req?.body.getReader().read()).value).toString(
          "utf8",
        ),
      )
    : {};

  if (body?.token !== process.env.WEBHOOK_POSTER_API_KEY) {
    return error404Response;
  }

  const { handleWebhook } = useWebhookPoster({
    token: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
  });

  const response = await handleWebhook({
    title: body.title ?? "",
    content: body.content ?? "",
    tags: body.tags ?? [],
    metadata: body.metadata ?? {},
    published: typeof body.published === "undefined" ? false : body.published,
    group: body.group ?? "posts",
    created_at: body.created_at,
  });

  if (!response) {
    return new Response(
      JSON.stringify({
        message: "Something went wrong please try again!",
        status: 418,
        statusText: "I'm a teapot",
      }),
    );
  }

  return new Response(
    JSON.stringify({
      message: "Posted Successfully!",
    }),
  );
};
