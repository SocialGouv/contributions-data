import { type } from "os";

export as namespace Contributions;

export type QuestionRaw = {
  id: string
  index: number
  value: string
  answers: AnswerRaw[]
}

export type AnswerRaw = {
  id: string
  markdown: string
  references: Reference[]
  agreement: AgreementRaw
}

export type Question = {
  id: string
  index: number
  title: string
  answers: {
    generic: GenericAnswer
    conventions: Answer[]
  }
}

export type Answer = AnswerRaw & {
  idcc: string
}

export type GenericAnswer = {
  id: string
  markdown: string
  description: string
  text: string
  references: Reference[]
}

export type Reference = {
  category: string
  title: string
  url: string
  dila_id: string
  dila_cid: string
  dila_container:string
}

export type AgreementRaw = {
  idcc: string 
  name: string
  parent_id: string
}
 
export function sortByFn  <T, K extends keyof T>(key: K): (a: T, b: T) => number 
export function createRefFn(idcc:string) : (ref: Reference) => Reference
