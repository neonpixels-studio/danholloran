import projects from "./../.vitepress/content/projects";

export default {
  paths() {
    return projects.map(({ slug }) => {
      return { params: { slug } };
    });
  },
};
