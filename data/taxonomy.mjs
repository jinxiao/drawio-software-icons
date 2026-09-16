// Legacy IDs remain valid for shared category links and previously opened XML libraries.
export const categoryAliases = {
  caching: 'databases', messaging: 'databases', storage: 'databases',
  containers: 'infrastructure', networking: 'infrastructure', systems: 'infrastructure', cloud: 'infrastructure',
  automation: 'development', ai: 'data', security: 'observability',
  collaboration: 'applications', media: 'applications',
};

// Classify by the project's purpose, independently of the upstream icon collection.
const projectCategories = {
  gitea: 'development', elasticsearch: 'databases', filezilla: 'development',
  babylonjs: 'frameworks', bevyengine: 'frameworks', godot: 'frameworks',
  libgdx: 'frameworks', love2d: 'frameworks', monogame: 'frameworks',
  p5js: 'frameworks', pixijs: 'frameworks', processing: 'frameworks',
  qt: 'frameworks', renpy: 'frameworks', sdl: 'frameworks', threejs: 'frameworks',
};

export function categoryForProject(id, previousCategory) {
  return projectCategories[id] ?? categoryAliases[previousCategory] ?? previousCategory;
}
