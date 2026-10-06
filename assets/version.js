(async function () {
  const owner = "impact-mb";
  const repo = "jsw-dashboard";

  async function loadVersion() {
    const targets = document.querySelectorAll(".jsw-version");

    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/tags`);
      if (!response.ok) throw new Error("Could not fetch tags");

      const tags = await response.json();

      let version = "Version unavailable";

      if (Array.isArray(tags) && tags.length > 0) {
        version = `Version ${tags[0].name}`;
      }

      targets.forEach(el => {
        el.textContent = version;
      });
    } catch (error) {
      console.error("Version fetch error:", error);
      targets.forEach(el => {
        el.textContent = "Version unavailable";
      });
    }
  }

  document.addEventListener("DOMContentLoaded", loadVersion);
})();