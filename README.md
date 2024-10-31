# Azure App Configuration Deploy Feature Flags

This GitHub Action deploys feature flags from a configuration file in your
GitHub repository to an App Configuration store. This enables GitHub Action
workflows where the App Configuration store is automatically updated when
changes are made to the configuration file.

JSON files are supported. For the full list of action inputs, see
[Inputs](./action.yml).

JSON file needs to follow schema mentioned in file
[here](./schema/feature-flag.v2.0.0.schema.json)

## Usage example

### Pre-requisites

Create a workflow `.yml` file in your repository's `.github/workflows`
directory. An [example workflow](#example-workflow) is available below. For more
information, see the GitHub Help Documentation for
[Creating a workflow file](https://help.github.com/en/articles/configuring-a-workflow#creating-a-workflow-file).

### Inputs

- `path` - A list of files, directories, and wildcard patterns to cache and
  restore. See
  [`@actions/glob`](https://github.com/actions/toolkit/tree/main/packages/glob)
  for supported patterns. Example:

```yaml
path: |
  /path/to/feature-flags*.json
  !/path/to/feature-flags-ignore.json
```

- `app-configuration-endpoint` - An Azure app configuration endpoint eg..
  `https://<app-configuration-name>.azconfig.io`
- `strict` - If strict, the sync operation deletes feature flags not found in
  the config file. Choices: true, false.
- `operation` - [optional] Possible values: validate or deploy - deploy by
  default. validate: only validates the configuration file. deploy: deploys the
  feature flags to Azure App Configuration deploy: Updates the Azure App
  configuration

### Example workflow

The following workflow updates the App Configuration store each time a change is
made to `feature-flags.json` in the repository.

```yaml
# File: .github/workflows/deploy-feature-flags.yml

on:
  workflow_dispatch:
  push:
    branches:
      - main
    paths:
      - /path/to/feature-flags.json

jobs:
  deploy-feature-flags:
    runs-on: ubuntu-latest
    concurrency:
      group: prod_environment
      cancel-in-progress: true
    permissions:
      id-token: write
      contents: read
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Azure login using Federated Credentials
        uses: azure/login@v2
        with:
          client-id: ${{ vars.AZURE_CLIENT_ID }}
          tenant-id: ${{ vars.AZURE_TENANT_ID }}
          subscription-id: ${{ vars.AZURE_SUBSCRIPTION_ID }}
          enable-AzPSSession: true

      - name: Deploy App Config feature flags
        uses: azure/app-configuration-deploy-feature-flags@v1
        with:
          path: /path/to/feature-flags.json
          app-configuration-endpoint: <app-configuration-endpoint>
          strict: false
```

The following workflow snippet validates feature flag config file. This is
useful in PR build.

```yaml
- name: Validate App Config feature flags
  uses: azure/app-configuration-deploy-feature-flags@v1
  with:
    path: /path/to/feature-flags.json
    app-configuration-endpoint: <app-configuration-endpoint>
    strict: false
    operation: validate
```

## Contributing

This project welcomes contributions and suggestions. Most contributions require
you to agree to a Contributor License Agreement (CLA) declaring that you have
the right to, and actually do, grant us the rights to use your contribution. For
details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether
you need to provide a CLA and decorate the PR appropriately (e.g., status check,
comment). Simply follow the instructions provided by the bot. You will only need
to do this once across all repos using our CLA.

This project has adopted the
[Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the
[Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any
additional questions or comments.

## Trademarks

This project may contain trademarks or logos for projects, products, or
services. Authorized use of Microsoft trademarks or logos is subject to and must
follow
[Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general).
Use of Microsoft trademarks or logos in modified versions of this project must
not cause confusion or imply Microsoft sponsorship. Any use of third-party
trademarks or logos are subject to those third-party's policies.
