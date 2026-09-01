-- Session-only: resets to this default each time Neovim restarts.
local last_args = "app info --path=../../apps/catalog-auditor"

local cli_root = vim.fn.getcwd()

local launch_config = {
  type = "pwa-node",
  request = "launch",
  name = "Launch: Shopify CLI",
  program = cli_root .. "/packages/cli/bin/dev.js",
  cwd = cli_root,
  sourceMaps = true,
  args = function()
    last_args = vim.fn.input("Shopify CLI args: ", last_args)
    return vim.split(last_args, " ", { trimempty = true })
  end,
  skipFiles = { "<node_internals>/**", "**/node_modules/**" },
}

local dap = require("dap")
for _, language in ipairs({ "javascript", "typescript" }) do
  dap.configurations[language] = dap.configurations[language] or {}
  table.insert(dap.configurations[language], launch_config)
end

-- Skips the F5 config picker: jumps straight to the Shopify CLI launch
-- config instead of "F5, pick Launch: Shopify CLI from the list".
vim.keymap.set("n", "<leader>dl", function()
  dap.run(launch_config)
end, { desc = "Debug: launch Shopify CLI" })
