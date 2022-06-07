import fetch from "node-fetch";
import { remark } from "remark";
import strip from "strip-markdown";

const mdStriper = remark().use(strip);
const API_URL =
  process.env.API_URL ||
  "https://contributions-api.codedutravail.fabrique.social.gouv.fr";

/** @type {ContributionsData.sortByFn} */
const sortBy = (key) => (a, b) => `${a[key]}`.localeCompare(`${b[key]}`);

/**
 *
 * @param {string|number} num
 */
const comparableIdcc = (num) => parseInt(num.toString(), 10);

/**
 *
 * @param {ContributionsData.AnswerRaw[]} answers
 */
function getGenericAnswer(answers) {
  const genericAnswer = answers.find((answer) => answer.agreement === null);
  if (!genericAnswer) {
    return;
  }
  let genericTextAnswer;
  try {
    genericTextAnswer = mdStriper
      .processSync(genericAnswer.markdown)
      // @ts-ignore
      .value.toString()
      .replace(/(\s)\s+/, "$1")
      .trim();
  } catch (e) {
    console.error(genericAnswer);
    console.error(mdStriper.processSync(genericAnswer.markdown));
    throw e;
  }
  return {
    description:
      genericTextAnswer.slice(0, genericTextAnswer.indexOf(" ", 150)) + "…",
    id: genericAnswer.id,
    markdown: genericAnswer.markdown,
    references: genericAnswer.references,
    text: genericTextAnswer,
  };
}

/** @type {ContributionsData.createRefFn} */
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
          reference.url = `https://legifrance.gouv.fr/conv_coll/id/${reference.dila_id}/?idConteneur=${agreement.id}`;
        } else if (agreement.url) {
          reference.url = agreement.url;
        }
        return reference;
      }
      case "labor_code": {
        if (reference.dila_id) {
          reference.url = `https://legifrance.gouv.fr/codes/id/${reference.dila_id}`;
        } else {
          reference.url =
            "https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006072050";
        }
        return reference;
      }
    }

    return reference;
  };
}
/** @type {ContributionsData.hasAgreement} */
function hasAgreement(agreements, idcc) {
  const agreement = agreements.find(
    (convention) => comparableIdcc(convention.num) === comparableIdcc(idcc)
  );
  return agreement ? true : false;
}

/**
 *
 * Fetch contributions from the contributions api
 * retrieve all the answers, questions, references
 * resolve CCN references by IDCC from @socialgouv/kali-data
 *
 */
async function fetchContributions() {
  /** @type {[ContributionsData.QuestionRaw[], ContributionsData.IndexedAgreement[]]} */
  const [questions, agreements] = await Promise.all([
    fetch(
      `${API_URL}/questions?select=id,value,index,answers:public_answers(id,markdown:value,references:answers_references(title:value,url,dila_id,dila_cid,dila_container_id,category),agreement(name,idcc,parent_id))&order=index`
    ).then((r) => r.json()),
    fetch(
      `https://raw.githubusercontent.com/SocialGouv/kali-data/master/data/index.json`
    ).then((r) => r.json()),
  ]);

  return /**@type {ContributionsData.Question[]} */ (
    questions.flatMap(({ id, index, value: title, answers }) => {
      const genericAnswer = getGenericAnswer(answers);
      if (!genericAnswer) return [];
      return {
        answers: {
          conventions: answers
            .filter((answer) => answer.agreement !== null)
            .filter((answer) => hasAgreement(agreements, answer.agreement.idcc))
            .map((answer) => ({
              id: answer.id,
              idcc: answer.agreement.idcc,
              markdown: answer.markdown,
              references: answer.references
                .map(createGetRefUrl(agreements, answer.agreement.idcc))
                .sort(sortBy("title")),
            }))
            .sort(sortBy("idcc")),
          generic: genericAnswer,
        },
        id,
        index,
        title,
      };
    })
  );
}

export default fetchContributions;
