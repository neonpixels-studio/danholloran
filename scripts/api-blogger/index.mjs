#!/usr/bin/node

// Each topic then needs to be put through Chat GPT to be written
// Each post needs to be put through Grammarly API
// Front matter needs to be added
// Post needs to be created in Dato
// It needs to be added to the blog post todoist list

import topics from "./topics.mjs";
// https://maker.ifttt.com/trigger/api_blogger/json/with/key/cPsQ67s3zwTKlYEUVOmamt
const writePost = async (topic) => {
  console.log(content);
  //
};

// Request comes in with topics
await Promise.all(topics.map(writePost));
console.log(topics);
