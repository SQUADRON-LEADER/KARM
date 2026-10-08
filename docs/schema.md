# Data Model

The current implementation uses MongoDB/Mongoose. This diagram documents the current submission state; the assessment brief asks for PostgreSQL or MySQL, so migrating these relationships to a relational database remains a rubric gap.

```mermaid
erDiagram
  USER ||--o{ PROJECT : owns
  USER ||--o{ TASK : owns
  USER ||--o{ ACTIVITY : creates
  PROJECT ||--o{ TASK : contains

  USER {
    ObjectId id PK
    string fullName
    string email UK
    string passwordHash
    string avatar
    datetime createdAt
  }
  PROJECT {
    ObjectId id PK
    ObjectId userId FK
    string name
    string description
    enum status
    string startDate
    string endDate
    datetime createdAt
  }
  TASK {
    ObjectId id PK
    ObjectId userId FK
    ObjectId projectId FK
    string name
    string description
    enum priority
    enum status
    string dueDate
    string[] tags
    datetime createdAt
  }
  ACTIVITY {
    ObjectId id PK
    ObjectId userId FK
    string type
    string message
    datetime createdAt
  }
```
