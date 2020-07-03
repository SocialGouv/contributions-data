import { type } from "os";

export as namespace Contributions;

type QuestionRaw = {
  id: string
  index: number
  value: string
  answers: AnswerRaw[]
}

type AnswerRaw = {
  id: string
  markdown: string
  references: Reference[]
  agreement: AgreementRaw
}

type Question = {
  id: string
  index: number
  title: string
  answers: {
    generic: GenericAnswer
    conventions: Answer[]
  }
}

type Answer = AnswerRaw & {
  idcc: string
}

type GenericAnswer = {
  id: string
  markdown: string
  description: string
  text: string
  references: Reference[]
}

type Reference = {
  category: string
  title: string
  url: string
  dila_id: string
  dila_cid: string
  dila_container_id:string
}

type AgreementRaw = {
  idcc: string 
  name: string
  parent_id: string
}
 
function sortByFn  <T, K extends keyof T>(key: K): (a: T, b: T) => number 
function createRefFn(agreements: IndexedAgreement[], idcc:string) : (ref: Reference) => Reference

// from https://github.com/SocialGouv/kali-data/blob/master/src/index.d.ts
type IndexedAgreement = {
  active?: boolean;
  /** Publication ISO date */
  date_publi?: string;
  effectif?: number;
  etat?: State;
  /** Agreement ID */
  id: string;
  mtime?: number;
  nature: "IDCC";
  /** Agreement IDCC */
  num: number;
  shortTitle: string;
  texte_de_base?: string;
  title: string;
  url?: string;
};
