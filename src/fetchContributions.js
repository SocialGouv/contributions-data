import fetch from "node-fetch";
import remark from "remark";
import strip from "strip-markdown";

const mdStriper = remark().use(strip);
const CDTN_API_URL =
  process.env.CDTN_API_URL || "https://cdtn-api.fabrique.social.gouv.fr";
const API_URL =
  process.env.API_URL ||
  "https://contributions-api.codedutravail.fabrique.social.gouv.fr";

/** @type {Contributions.sortByFn} */
const sortBy = (key) => (a, b) => `${a[key]}`.localeCompare(`${b[key]}`);

/**
 *
 * @param {string|number} num
 */
const comparableIdcc = (num) => parseInt(num.toString(), 10);

/**
 *
 * @param {Contributions.AnswerRaw[]} answers
 */
function getGenericAnswer(answers) {
  const genericAnswer = answers.find((answer) => answer.agreement === null);
  if (!genericAnswer) {
    return;
  }
  const genericTextAnswer = mdStriper
    .processSync(genericAnswer.markdown)
    .contents.toString()
    .replace(/(\s)\s+/, "$1")
    .trim();

  return {
    id: genericAnswer.id,
    text: genericTextAnswer,
    description:
      genericTextAnswer.slice(0, genericTextAnswer.indexOf(" ", 150)) + "…",
    references: genericAnswer.references,
    markdown: genericAnswer.markdown,
  };
}

/** @type {Contributions.createRefFn} */
function createGetRefUrl(agreements, idcc) {
  const agreement = agreements.find(
    (convention) => comparableIdcc(convention.num) === comparableIdcc(idcc)
  );
  if (!agreement) {
    throw new Error(`agreement ${idcc} not found `);
  }
  return function getRefUrl(reference) {
    switch (reference.category) {
      case "agreement": {
        if (reference.dila_id) {
          reference.url = `https://beta.legifrance.gouv.fr/conv_coll/id/${reference.dila_id}/?idConteneur=${agreement.id}`;
        } else if (agreement.url) {
          reference.url = agreement.url;
        }
        return reference;
      }
      case "labor_code": {
        if (reference.dila_id) {
          reference.url = `https://www.legifrance.gouv.fr/affichCodeArticle.do?idArticle=${reference.dila_id}&cidTexte=LEGITEXT000006072050`;
        } else {
          reference.url =
            "https://www.legifrance.gouv.fr/affichCode.do?cidTexte=LEGITEXT000006072050";
        }
        return reference;
      }
    }

    return reference;
  };
}

/**
 *
 * Fetch contributions from the contributions api
 * retrieve all the answers, questions, references
 * resolve CCN references by IDCC from @socialgouv/kali-data
 *
 */
async function fetchContributions() {
  /** @type {[Contributions.QuestionRaw[], Contributions.IndexedAgreement[]]} */
  const [questions, agreements] = await Promise.all([
    fetch(
      `${API_URL}/questions?select=id,value,index,answers:public_answers(id,markdown:value,references:answers_references(title:value,url,dila_id,dila_cid,category),agreement(name,idcc,parent_id))&order=index`
    ).then((r) => r.json()),
    fetch(`${CDTN_API_URL}/agreements`).then((r) => r.json()),
  ]);

  return /**@type {Contributions.Question[]} */ (questions.flatMap(
    ({ id, index, value: title, answers }) => {
      const genericAnswer = getGenericAnswer(answers);
      if (!genericAnswer) return [];
      return {
        id,
        index,
        title,
        answers: {
          generic: genericAnswer,
          conventions: answers
            .filter((answer) => answer.agreement !== null)
            .map((answer) => ({
              id: answer.id,
              idcc: answer.agreement.idcc,
              markdown: answer.markdown,
              references: answer.references
                .map(createGetRefUrl(agreements, answer.agreement.idcc))
                .sort(sortBy("title")),
            }))
            .sort(sortBy("idcc")),
        },
      };
    }
  ));
}

module.exports = fetchContributions;
