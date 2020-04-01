const fs = require("fs");
const fetchContributions = require("./src/fetchContributions");

if (require.main === module) {
  fetchContributions()
    .then((data) => {
      const outPath = "./data/contributions.json";
      fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
      console.log(`✔ wrote ${data.length} contributions to ${outPath}`);
      console.log();
    })
    .catch((e) => {
      console.error(e);
      throw e;
    });
}
