import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { userEvent, within } from "storybook/test";

import { UserForm } from "../app/components/UserForm";

const meta = {
  title: "Example/UserForm",
  component: UserForm,
  parameters: {
    layout: "centered",
    nextjs: {
      appDirectory: true,
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-zinc-50 p-8 dark:bg-black">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof UserForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Filled: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText(/名前/i), "山田太郎");
    await userEvent.click(canvas.getByLabelText(/男性/i));
    await userEvent.type(canvas.getByLabelText(/生年月日/i), "1990-01-15");
    await userEvent.type(
      canvas.getByLabelText(/備考/i),
      "よろしくお願いします"
    );
  },
};

export const WithValidationErrors: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /保存/i }));
  },
};

export const Editing: Story = {
  args: {
    defaultProfile: {
      name: "山田太郎",
      gender: "male",
      birthDate: "1990-01-15",
      note: "よろしくお願いします",
      bloodType: "A",
    },
  },
};
