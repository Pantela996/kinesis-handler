# kinesis-handler

This service represents an AWS Kinesis lambda handler. The purpose of it is to listen to the kinesis stream for certain types of events and react to them properly.

It also contains an instance of the AWS Kinesis Client that can produce events to a certain stream. Records of the kinesis stream are handled in batches, where the unique identifier of one message is `eventId`.

- [Installation](#installation)
- [Usage](#usage)
- [Decision making](#decision-making)
- [Answers](#answers)

## Installation

There are multiple ways you can start this project.

Precondition: set the env variable `DB=inMemory` or create the .env file with values from the example .env_example. For Docker, no action is needed

1. The first and easier one is using `docker-compose` with the command `docker-compose up --build` at the root of the repository. This will run the script inside of the Docker container and also will set up a local version of Kinesis. For the example purposes, a local version of the Kinesis stream is set up, but publishing of the event is disabled for now.

This Dockerfile base image is a base image for Lambda, so the behavior we will get on the local runs should be the same as the behavior on the cloud.

2. The second way is by doing the command `npm install` at the root of the file, and running the `npm run dev` command.

3. There are also Unit/Integration tests that you can run after installing the dependencies with `npm run test`

## Usage

This service receives the events from the stream, checks their type, and based on type performs actions in the `storage`. Storage can be a type of InMemoryDB or DynamoDB. `DynamoDB` implementation is a mock implementation and it is there for example purposes, the code will not work with it. For this reason, it is recommended to use inMemoryDB by setting the `.env` variable `DB=inMemory`. This variable can be controlled from the `./config/.env` file.

For local purposes AWS Kinesis Client is disabled, for the Docker purpose you can uncomment these parts of the code and it should work correctly

## Decision Making

This is a short-running service, but also this service handles more different records. One of the crucial points of working with Lambda functions is good logging, so for each record that is processed at that moment (notice that we are forcing synchronous processing of the data), we are enforcing the current `eventId` to be injected in every service. Also, every service will create its own `Logger` that will add `ServiceName` to every log produced by it.

Given that the assignment specifies that the Databases needed to be interchangeable, for this purpose classic `Repository pattern` was used. We will have an interface with signatures that both of the implementations implement. In this way, based on the env variable `DB` at the start of the lambda service is deciding which Database it will use during the runtime.

## Answers

1. The thing I liked about the assignment was that I had the opportunity to learn more about AWS Kinesis. I had the opportunity to work with both SQS and SNS, so at the start I was a bit confused about what exactly is purpose compared to these 2. But reading documentation and with some implementation, and with the context you are using it for, I have a better grasp on how to use it and combine it with the mentioned technologies.

Also, it was pretty easy to achieve the gist of the assignment, so I could focus more on the quality and reusability of the code I wrote.

The thing I think could be better is an explanation of the context of the `event.json` file. For me, it wasn't clear if it was entirely a payload of the `data` property of AWS Kinesis Record or if it was an altered version of it. In the provided code I assumed it is an example of the AWS Kinesis Record with some of the missing data irrelevant to this task.

Also, some of the edge cases are not maybe defined as well, because it could be that one user can have more limits or just one limit. Then when I want to save a Limit that already exists should I throw the error or just override it? Some questions of that kind pop into my mind

2. To change this service to better fulfill desired behavior, I would change it from the short-running type of task `Lambda` to something more long-running like `ECS Task`.
   This would consider changing the structure of the code to be more API-style. Of course, we would also swap from `inMemoryDB` to some real DB, like `DynamoDB` in our example.

I would prefer API instead of lambda for a few reasons. - For the often communication between client and service, it's better to have a standardized interface for communication - Cost optimization, long-running service should be a more efficient solution for a large number of requests - Lambda limited runtime nature - Lambda cold starts after a period of not being used will impact the users - ECS Tasks tend to have better latency

Sub tickets for this ask are: - Create v2 of service, in the API style using the Express - Create new Database service - Define the relational/non-relational schema for the Domain - Define endpoints on the service for the client - Define security mechanisms of the new serviceV2 - Write the migrations for the existing data in memory

3. It would return most standard format, JSON, and the signatures would look something like this.

API Endpoint:

1. `/users-limit/{id}`

```json
{
    "userId": "123",
    "limitId": "123",
    "value": "1000",
    "progress": "750",
    "nextResetTime" : 123456
}
```

2. `/user-limits/user/{user_id}`

```json
[
	{
		"limitId": "123",
		"value": "1000",
		"progress": "750",
		"nextResetTime": 123456
	}
]
```

4. a. In this service, we are already utilizing the interchangeability of the Databases using the Dependency Injection, by injecting the configuration with a .env file. In this way, we can make multistage and multi-environment solutions.

b. This service currently supports only a few types of events, but it's easily extendable for new types of events, with different payloads. Introducing new types of entities should also not be an issue as it would require only adding handler, validations, repository, and model to add it to the code architecture.

This solution was with the purpose of it being interchangeable and easy to extend and reuse.
