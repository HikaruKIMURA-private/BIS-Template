import type { FieldMetadata } from "@conform-to/react";
import { getInputProps, getTextareaProps } from "@conform-to/react";

import {
  BLOOD_TYPE_OPTIONS,
  GENDER_OPTIONS,
} from "../schema";

type ProfileFieldBundle = {
  name: FieldMetadata<string>;
  gender: FieldMetadata<string>;
  bloodType: FieldMetadata<string>;
  birthDate: FieldMetadata<string>;
  note: FieldMetadata<string>;
};

type ProfileFormFieldsProps = {
  fields: ProfileFieldBundle;
};

export function ProfileFormFields({ fields }: ProfileFormFieldsProps) {
  return (
    <>
      <div className="mb-4">
        <label
          htmlFor={fields.name.id}
          className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          名前
        </label>
        <input
          {...getInputProps(fields.name, { type: "text" })}
          placeholder="山田太郎"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-blue-400 dark:focus:ring-blue-400"
        />
        {fields.name.errors && fields.name.errors.length > 0 && (
          <p
            id={`${fields.name.id}-error`}
            className="mt-1 text-sm text-red-600 dark:text-red-400"
            role="alert"
          >
            {fields.name.errors[0]}
          </p>
        )}
      </div>

      <div className="mb-4">
        <fieldset>
          <legend className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            性別
          </legend>
          <div className="flex gap-4">
            {GENDER_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-center gap-2">
                <input
                  {...getInputProps(fields.gender, {
                    type: "radio",
                    value: option.value,
                  })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
          {fields.gender.errors && fields.gender.errors.length > 0 && (
            <p
              id={`${fields.gender.id}-error`}
              className="mt-1 text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {fields.gender.errors[0]}
            </p>
          )}
        </fieldset>
      </div>

      <div className="mb-4">
        <fieldset>
          <legend className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            血液型
          </legend>
          <div className="flex gap-4">
            {BLOOD_TYPE_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-center gap-2">
                <input
                  {...getInputProps(fields.bloodType, {
                    type: "radio",
                    value: option.value,
                  })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
          {fields.bloodType.errors && fields.bloodType.errors.length > 0 && (
            <p
              id={`${fields.bloodType.id}-error`}
              className="mt-1 text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {fields.bloodType.errors[0]}
            </p>
          )}
        </fieldset>
      </div>

      <div className="mb-4">
        <label
          htmlFor={fields.birthDate.id}
          className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          生年月日
        </label>
        <input
          {...getInputProps(fields.birthDate, { type: "date" })}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-blue-400 dark:focus:ring-blue-400"
        />
        {fields.birthDate.errors && fields.birthDate.errors.length > 0 && (
          <p
            id={`${fields.birthDate.id}-error`}
            className="mt-1 text-sm text-red-600 dark:text-red-400"
            role="alert"
          >
            {fields.birthDate.errors[0]}
          </p>
        )}
      </div>

      <div className="mb-6">
        <label
          htmlFor={fields.note.id}
          className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          備考
        </label>
        <textarea
          {...getTextareaProps(fields.note)}
          placeholder="自己紹介など"
          rows={4}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-blue-400 dark:focus:ring-blue-400"
        />
        {fields.note.errors && fields.note.errors.length > 0 && (
          <p
            id={`${fields.note.id}-error`}
            className="mt-1 text-sm text-red-600 dark:text-red-400"
            role="alert"
          >
            {fields.note.errors[0]}
          </p>
        )}
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          500文字以内で入力してください
        </p>
      </div>
    </>
  );
}
