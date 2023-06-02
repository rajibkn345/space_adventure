// vite.config.js
module.exports = {
  build: {
    rollupOptions: {
      external: ["three/examples/jsm/loaders/gltfloader.js"],
    },
  },
};
