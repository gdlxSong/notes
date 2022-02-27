---
title: Configure CI/CD for your application
sidebar_position: 3
---

> docs: https://docs.docker.com/language/golang/configure-ci-cd/



This page guides you through the process of setting up a GitHub Action CI/CD pipeline with Docker containers. Before setting up a new pipeline, we recommend that you take a look at Ben’s blog on CI/CD best practices.

> 本页面将指导您完成使用 Docker 容器设置 GitHub Action CI/CD 管道的过程。在设置新管道之前，我们建议您查看 Ben 关于 CI/CD 最佳实践的博客。

This guide contains instructions on how to:

- Set up continuous integration (CI) pipeline using GitHub Actions;
- Enable Docker Hub access for continuous deployment (CD) tools;
- Optimize your GitHub Actions-based CI/CD pipeline to reduce the number of pull requests and the total build time; and
- Release only specific versions of your application to Docker Hub.


## Choose a sample project


Let’s get started. This guide uses a simple Go project as an example. In fact, it is the same project we got acquainted with in Build Images part of this guide. The olliefr/docker-gs-ping repository contains the full source code and the Dockerfile. You can either fork it or to follow along and set up one of your own Go projects in a fashion described in this section.

> 让我们开始吧。本指南以一个简单的 Go 项目为例。事实上，它与我们在本指南的构建映像部分中熟悉的项目相同。 `olliefr/docker-gs-ping` 存储库包含完整的源代码和 Dockerfile。您可以分叉它，也可以按照本节中描述的方式设置您自己的 Go 项目。


Thus, as long as you have a GitHub repo with a project and a Dockerfile, you can complete this part of the tutorial.

> 因此，只要您有一个包含项目和 Dockerfile 的 GitHub 存储库，您就可以完成本教程的这一部分。


## Enable access to Docker Hub

The Docker Hub is a hosted repository service provided by Docker for finding and sharing container images.

> Docker Hub 是 Docker 提供的用于查找和共享容器镜像的托管存储库服务。

Before we can publish our Docker image to Docker Hub, we must grant GitHub Actions access to Docker Hub API.

> 在将 Docker 映像发布到 Docker Hub 之前，我们必须授予 GitHub Actions 对 Docker Hub API 的访问权限。

To set up the access to Docker Hub API:




1. Create a new Personal Access Token (PAT) for Docker Hub.
- Go to the Docker Hub Account Settings and then click New Access Token.
- Let’s call this token docker-gs-ping-ci. Input the name and click Create.
- Copy the token value, we’ll need it in a second.

2. Add your Docker ID and PAT as secrets to your GitHub repo.
- Navigate to your GitHub repository and click Settings > Secrets > New secret.
- Create a new secret with the name DOCKER_HUB_USERNAME and your Docker ID as value.
- Create a new secret with the name DOCKER_HUB_ACCESS_TOKEN and use the token value from the step (1).


![github_cicd_github_secret_key_setting](/images/github_cicd_github_secret_key_setting.png)

Now it will be possible to refer to these two variables from our workflows. This will open up an opportunity to publish our image to Docker Hub.

> 现在可以从我们的工作流程中引用这两个变量。这将为将我们的镜像发布到 Docker Hub 提供机会。

## Set up the CI workflow

In the previous section, we created a PAT and added it to GitHub to ensure we can access Docker Hub from any GitHub Actions workflow. But before setting out to build the images for releasing our software, let’s build a CI pipeline to run the tests first.

> 在上一节中，我们创建了一个 PAT 并将其添加到 GitHub，以确保我们可以从任何 GitHub Actions 工作流访问 Docker Hub。但在开始构建用于发布我们的软件的映像之前，让我们先构建一个 CI 管道来运行测试。

To set up the workflow:


- Go to your repository in GitHub and then click Actions > New workflow.
- Click set up a workflow yourself and update the starter template to match the following:



First, we will name this workflow:

```yaml
name: Run CI
```

Then, we will choose when we run this workflow. In our example, we are going to do it for every push against the main branch of our project:

> 然后，我们将选择何时运行此工作流程。在我们的示例中，我们将对项目主分支的每次推送执行此操作：

```yaml
on:
  push:
    branches: [ main ]
  workflow_dispatch:
```

The workflow_dispatch is optional. It enables to run this workflow manually from the Actions tab.

> workflow_dispatch 是可选的。它允许从“操作”选项卡手动运行此工作流。

Now, we need to specify what we actually want to happen within our workflow. A workflow run is made up of one or more jobs that can run sequentially or in parallel.

> 现在，我们需要指定我们实际希望在工作流程中发生的事情。工作流运行由一个或多个可以按顺序或并行运行的作业组成。

The first job we would like to set up is the one to build and run our tests. Let it be run on the latest Ubuntu instance:

> 我们要设置的第一项工作是构建和运行我们的测试。让它在最新的 Ubuntu 实例上运行：

```bash
jobs:
  build-and-test:
    runs-on: ubuntu-latest
```

A job is a sequence of steps. For this simple CI pipeline we would like to:

- Set up Go compiler environment.
- Check out our code from its GitHub repository.
- Fetch Go modules used by our application.
- (Optional) Build the binary for our application.
- Build the Docker Image for our application.
- Run the functional tests for our application against that Docker image.


Building the binary in step 4 is actually optional. It is a “smoke test”. We don’t want to be building a Docker image and attempting functional testing if our application does not even compile. If we had “unit tests” or some other small tests, we would run them between steps 4 and 5 as well.

> 在步骤 4 中构建二进制文件实际上是可选的。这是一个“烟雾测试”。如果我们的应用程序甚至无法编译，我们不想构建 Docker 映像并尝试进行功能测试。如果我们有“单元测试”或其他一些小测试，我们也会在第 4 步和第 5 步之间运行它们。


The following sequence of steps achieves the goals we just set.

```yaml
    steps:
      - name: Install Go
        uses: actions/setup-go@v2
        with:
          go-version: 1.16.4

      - name: Checkout code
        uses: actions/checkout@v2

      - name: Fetch required Go modules
        run:  go mod download

      - name: Build
        run:  go build -v ./...

      - name: Build Docker image
        uses: docker/build-push-action@v2
        with:
          push: false
          tags: ${{ github.event.repository.name }}:latest, ${{ github.repository }}:latest

      - name: Run functional tests
        run:  go test -v ./...
```


As is usual with YAML files, be aware of indentation. The complete workflow file for reference is available in the project’s repo, under the name of .github/workflows/ci.yml.

> 与 YAML 文件一样，请注意缩进。完整的工作流文件可在项目的 repo 中以 .github/workflows/ci.yml 的名称获得。

This should be enough to test our approach to CI. Change the workflow file name from main.yml to ci.yml and press Start commit button. Fill out the commit details in your preferred style and press Commit new file. GitHub Actions are saved as YAML files in .github/workflows directory and GitHub web interface would do that for us.

> 这应该足以测试我们的 CI 方法。将工作流文件名从 main.yml 更改为 ci.yml，然后按 Start commit 按钮。以您喜欢的样式填写提交详细信息，然后按提交新文件。 GitHub Actions 保存为 .github/workflows 目录中的 YAML 文件，GitHub Web 界面会为我们执行此操作。


Select Actions from the navigation bar for your repository. Since we’ve enabled workflow_dispatch option in our Action, GitHub will have started it already. If not, select “CI/CD to Docker Hub” action on the left, and then press Run workflow button on the right to start the workflow.

> 从存储库的导航栏中选择操作。由于我们在 Action 中启用了 workflow_dispatch 选项，GitHub 已经启动了它。如果没有，请选择左侧的“CI/CD to Docker Hub”操作，然后按右侧的运行工作流按钮启动工作流。



![github_cicd_github_secret_key_setting02](/images/github_cicd_github_secret_key_setting02.png)


Should the run fail, you can click on the failing entry to see the logs and amend the workflow YAML file accordingly.

> 如果运行失败，您可以单击失败的条目以查看日志并相应地修改工作流 YAML 文件。


## Set up the CD workflow

Now, let’s create a GitHub Actions workflow to build and store the image for our application in Docker Hub. We can achieve this by creating two Docker actions:

> 现在，让我们创建一个 GitHub Actions 工作流来为我们的应用程序在 Docker Hub 中构建和存储映像。我们可以通过创建两个 Docker 操作来实现这一点：

- The first action enables us to log in to Docker Hub using the secrets we stored in the GitHub Repository settings.
- The second one is the build and push action.

In this example, let us set the push flag to true as we also want to push. We’ll then add a tag to specify to always go to the latest version. Lastly, we’ll echo the image digest to see what was pushed.

> 在此示例中，让我们将推送标志设置为 true，因为我们也想推送。然后，我们将添加一个标签以指定始终使用最新版本。最后，我们将回显图像摘要以查看推送的内容。

Now, we can add the steps required. Start a blank new workflow, just as we did before. Let’s give it a file name of release.yml and amend the template body to match the following.

> 现在，我们可以添加所需的步骤。就像我们之前做的那样，开始一个空白的新工作流程。让我们给它一个文件名 release.yml 并修改模板正文以匹配以下内容。

```yaml
name: Release to Docker Hub

on:
  push:
    tags:
      - "*.*.*"

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - name: Login to Docker Hub
        uses: docker/login-action@v1
        with:
          username: ${{ secrets.DOCKER_HUB_USERNAME }}
          password: ${{ secrets.DOCKER_HUB_ACCESS_TOKEN }}

      - name: Install Go
        uses: actions/setup-go@v2
        with:
          go-version: 1.16.4

      - name: Checkout code
        uses: actions/checkout@v2

      - name: Fetch required Go modules
        run:  go mod download

      - name: Build
        run:  go build -v ./...

      - name: Build and push Docker image
        id:   docker_build
        uses: docker/build-push-action@v2
        with:
          push: true
          tags: ${{ secrets.DOCKER_HUB_USERNAME }}/${{ github.event.repository.name }}:latest

      - name: Image digest
        run: echo ${{ steps.docker_build.outputs.digest }}
```



This workflow is similar to the CI workflow, with the following changes:

- This workflow is only triggered when a git tag of the format *.*.* is pushed to the repo. The tag meant to be a semantic version, such as 3.5.0 or 0.0.1.
- The very first step is to login into Docker Hub using the two secrets that we had saved in the repository settings previously.
- The build and push step now has push: true and since we had logged into Docker Hub this will result in the latest image being published.
- The image digest step prints out the image metadata to the log.


Let’s save this workflow and check the Actions page for the repository on GitHub. Unlike the CI workflow, this new workflow cannot be triggered manually - this is how we set it up. So, in order to test it, we have to tag some commit. Let’s tag the HEAD of the main branch:

> 让我们保存这个工作流程并检查 GitHub 上存储库的 Actions 页面。与 CI 工作流程不同，这个新的工作流程不能手动触发——这就是我们设置它的方式。所以，为了测试它，我们必须标记一些提交。让我们标记主分支的 HEAD：


This means our tag was successfully pushed to the main repo. If we switch to the GitHub UI, we would see that the workflow has already been triggered:









