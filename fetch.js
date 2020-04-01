const fetchContributions = require("./src/fetchContributions");

if (require.main === module) {
  fetchContributions()
    .then((data) => console.log(JSON.stringify(data, null, 2)))
    .catch(console.error);
}

