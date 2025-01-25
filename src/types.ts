import { Property, TypeOption } from "langium/grammar";

export type FlattenedInterface = { name: string, properties: Property[], isConcrete: boolean, containerTypes: TypeOption[] }

export type FlattenedTranslatedInterface = { name: string, attributes: TranslatedAttribute[], isConcrete: boolean, containerTypes: string[] }

export type TranslatedAttribute = { name: string, type: string }