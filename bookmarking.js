document.addEventListener("DOMContentLoaded", () => {
  const memberstack = window.$memberstackDom;

  const updateButtonVisibility = async function (button, memberDataJsonKey) {
    const itemId = button.getAttribute("ms-code-save-child");
    const member = await memberstack.getMemberJSON();

    const savedItems =
      member.data && member.data[memberDataJsonKey]
        ? member.data[memberDataJsonKey]
        : [];
    const isItemSaved = savedItems.includes(itemId);

    const saveButton = button;
    const parentElement = button.closest("[ms-code-save]");
    const unsaveButtons = parentElement.querySelectorAll(
      `[ms-code-unsave-child="${itemId}"]`
    );

    unsaveButtons.forEach((unsaveButton) => {
      if (isItemSaved) {
        saveButton.style.display = "none";
        unsaveButton.style.display = "flex";
      } else {
        saveButton.style.display = "flex";
        unsaveButton.style.display = "none";
      }
    });
  };

  const toggleLikeButton = async function (button, memberDataJsonKey) {
    const itemId = button.getAttribute("ms-code-save-child");
    const member = await memberstack.getMemberJSON();

    if (!member.data) {
      member.data = {};
    }

    if (!member.data[memberDataJsonKey]) {
      member.data[memberDataJsonKey] = [];
    }

    const isItemSaved = member.data[memberDataJsonKey].includes(itemId);

    const parentElement = button.closest("[ms-code-save]");
    const unsaveButtons = parentElement.querySelectorAll(
      `[ms-code-unsave-child="${itemId}"]`
    );

    if (isItemSaved) {
      member.data[memberDataJsonKey] = member.data[memberDataJsonKey].filter(
        (item) => item !== itemId
      );
      button.style.display = "flex";
      unsaveButtons.forEach((unsaveButton) => {
        unsaveButton.style.display = "none";
      });
    } else {
      member.data[memberDataJsonKey].push(itemId);
      button.style.display = "none";
      unsaveButtons.forEach((unsaveButton) => {
        unsaveButton.style.display = "flex";
      });
    }

    await memberstack.updateMemberJSON({
      json: member.data
    });

    updateButtonVisibility(button, memberDataJsonKey);
  };

  memberstack.getCurrentMember().then(({ data }) => {
    if (data) {
      // Member is logged in
      const saveButtons = document.querySelectorAll("[ms-code-save-child]");

      saveButtons.forEach((button) => {
        const memberDataJsonKey =
          button.getAttribute("ms-code-save") ||
          button.closest("[ms-code-save]").getAttribute("ms-code-save");
        updateButtonVisibility(button, memberDataJsonKey);
        button.addEventListener("click", async function (event) {
          event.preventDefault();
          await toggleLikeButton(button, memberDataJsonKey);
        });
      });

      const unsaveButtons = document.querySelectorAll("[ms-code-unsave-child]");

      unsaveButtons.forEach((button) => {
        const memberDataJsonKey =
          button.getAttribute("ms-code-save") ||
          button.closest("[ms-code-save]").getAttribute("ms-code-save");
        button.addEventListener("click", async function (event) {
          event.preventDefault();
          const parentElement = button.closest("[ms-code-save]");
          const saveButton = parentElement.querySelector(
            `[ms-code-save-child="${button.getAttribute(
              "ms-code-unsave-child"
            )}"]`
          );
          await toggleLikeButton(saveButton, memberDataJsonKey);
        });
      });
    } else {
      // If member is not logged in
    }
  });
});
