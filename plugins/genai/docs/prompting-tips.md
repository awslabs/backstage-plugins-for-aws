# Prompting tips

Here are various prompting tips that can help improve the responses from agents.

## Limiting response length

To help provide more succinct responses and also save on token costs you can tell models to limit their response length.

```
Responses should be 150 words at most.
```

## Markdown output

The chat assistant UI page renders output in a Markdown component, so instructing agents to output accordingly can improve output quality. For example this will result in code snippets being formatted, the ability to provide browser links, rendering tables and so on.

```
Answers should always be well-structured and use well-formed Markdown.
```

## Teaching about the Backstage catalog

It can help to teach agents about the how the Backstage catalog works. For example:

```
The Backstage catalog contains important information about the users software platform and organization. Each item in the catalog is an 'entity' that can contain the following information:

- Metadata such as the name
- Relationships such as entities that depend on that entity, for example resources that a component relies on

Entities can be of the following "kinds":

- Component: A microservice or application
- Resource: infrastructure a system needs to operate like a database, object store bucket or load balancer
- User: A user in the organization
- Group: A group or team that usually has one or more User entities associated
- API: Information regarding an API within the organization, typically including an OpenAPI specification
- Template: A software template used to start a new software project

When asked about a microservice, application or workload assume that this refers to a component in the Backstage catalog. If a tool needs an entity name, kind or namespace first search the Backstage catalog for the relevant information if it is not already available.
```

## Linking to catalog entities

Agents can typically create accurate links to pages in the Backstage catalog based on results from the catalog and search tools.

```
When mentioning a Backstage entity by name in your response always format the entity name as a Markdown link of the format:

[entity name](/catalog/<namespace>/<kind>/<entity name>)

For example:

[carts-api](/catalog/default/component/carts-api)
```

## Preferring internal documentation

Its generally preferable to first search internal documentation before falling back on the models "general knowledge".

```
When providing a recommendation for remediation always search the TechDocs for a recommendation. If nothing is found then rely on your own knowledge.
```
