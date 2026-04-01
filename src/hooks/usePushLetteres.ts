import { addLetter } from "../utils/firebaseConfig";

type MaybeElement<T extends HTMLElement> = T | null;

interface PushLettersElements {
  form: HTMLFormElement;
  nameInput: HTMLInputElement;
  messageInput: HTMLTextAreaElement;
  charCount: HTMLSpanElement;
  submitButton: HTMLButtonElement;
  submitText: HTMLSpanElement;
  loadingSpinner: HTMLSpanElement;
  successMessage: HTMLDivElement;
  errorMessage: HTMLDivElement;
  writeAnotherButton: HTMLButtonElement;
  tryAgainButton: HTMLButtonElement;
}

const queryElement = <T extends HTMLElement>(
  root: ParentNode,
  id: string,
): MaybeElement<T> => root.querySelector<T>(`#${id}`);

const getElements = (root: ParentNode): PushLettersElements | null => {
  const form = queryElement<HTMLFormElement>(root, "letterForm");
  const nameInput = queryElement<HTMLInputElement>(root, "name");
  const messageInput = queryElement<HTMLTextAreaElement>(root, "message");
  const charCount = queryElement<HTMLSpanElement>(root, "charCount");
  const submitButton = queryElement<HTMLButtonElement>(root, "submitButton");
  const submitText = queryElement<HTMLSpanElement>(root, "submitText");
  const loadingSpinner = queryElement<HTMLSpanElement>(root, "loadingSpinner");
  const successMessage = queryElement<HTMLDivElement>(root, "successMessage");
  const errorMessage = queryElement<HTMLDivElement>(root, "errorMessage");
  const writeAnotherButton = queryElement<HTMLButtonElement>(
    root,
    "writeAnother",
  );
  const tryAgainButton = queryElement<HTMLButtonElement>(root, "tryAgain");

  if (
    !form ||
    !nameInput ||
    !messageInput ||
    !charCount ||
    !submitButton ||
    !submitText ||
    !loadingSpinner ||
    !successMessage ||
    !errorMessage ||
    !writeAnotherButton ||
    !tryAgainButton
  ) {
    return null;
  }

  return {
    form,
    nameInput,
    messageInput,
    charCount,
    submitButton,
    submitText,
    loadingSpinner,
    successMessage,
    errorMessage,
    writeAnotherButton,
    tryAgainButton,
  };
};

const updateCharacterCount = (
  messageInput: HTMLTextAreaElement,
  charCount: HTMLSpanElement,
) => {
  const count = messageInput.value.length;
  charCount.textContent = `${count} character${count !== 1 ? "s" : ""}`;
};

const flashInputError = (messageInput: HTMLTextAreaElement) => {
  messageInput.focus();
  messageInput.classList.add("input-error");

  window.setTimeout(() => {
    messageInput.classList.remove("input-error");
  }, 2000);
};

export const usePushLetteres = (root: ParentNode = document) => {
  const elements = getElements(root);
  if (!elements) {
    return () => {};
  }

  if (elements.form.dataset.pushLettersBound === "true") {
    return () => {};
  }

  elements.form.dataset.pushLettersBound = "true";

  const {
    form,
    nameInput,
    messageInput,
    charCount,
    submitButton,
    submitText,
    loadingSpinner,
    successMessage,
    errorMessage,
    writeAnotherButton,
    tryAgainButton,
  } = elements;

  const handleMessageInput = () => {
    updateCharacterCount(messageInput, charCount);
  };

  const handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault();

    const name = nameInput.value.trim();
    const message = messageInput.value.trim();

    errorMessage.classList.add("hidden");

    if (!message) {
      flashInputError(messageInput);
      return;
    }

    try {
      submitButton.disabled = true;
      submitButton.classList.add("btn-sending");
      submitText.classList.add("hidden");
      loadingSpinner.classList.remove("hidden");

      await addLetter({ name, message });

      form.classList.add("hidden");
      successMessage.classList.remove("hidden");
      successMessage.style.opacity = "1";

      form.reset();
      updateCharacterCount(messageInput, charCount);
    } catch (error) {
      console.error("Error sending letter:", error);
      errorMessage.classList.remove("hidden");
      errorMessage.style.opacity = "1";
    } finally {
      submitButton.disabled = false;
      submitButton.classList.remove("btn-sending");
      submitText.classList.remove("hidden");
      loadingSpinner.classList.add("hidden");
    }
  };

  const handleWriteAnother = () => {
    successMessage.classList.add("hidden");
    errorMessage.classList.add("hidden");
    form.classList.remove("hidden");
    nameInput.focus();
  };

  const handleTryAgain = () => {
    errorMessage.classList.add("hidden");
  };

  messageInput.addEventListener("input", handleMessageInput);
  form.addEventListener("submit", handleSubmit);
  writeAnotherButton.addEventListener("click", handleWriteAnother);
  tryAgainButton.addEventListener("click", handleTryAgain);

  updateCharacterCount(messageInput, charCount);

  return () => {
    delete form.dataset.pushLettersBound;
    messageInput.removeEventListener("input", handleMessageInput);
    form.removeEventListener("submit", handleSubmit);
    writeAnotherButton.removeEventListener("click", handleWriteAnother);
    tryAgainButton.removeEventListener("click", handleTryAgain);
  };
};
