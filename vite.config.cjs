// vite.config.js
module.exports = {
  build: {
    rollupOptions: {
      external: ["three", "three/examples/jsm/loaders/gltfloader.js"],
    },
  },
   base: './',
};
