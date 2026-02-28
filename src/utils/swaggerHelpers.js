// Swagger comment helpers to reduce repetition
export const swaggerTags = {
  user: "/* #swagger.tags = ['User'] */",
  posts: "/* #swagger.tags = ['Posts'] */",
};

export const swaggerSecurity =
  '/* #swagger.security = [{ "bearerAuth": [] }] */';

// Body schemas
export const swaggerSchemas = {
  registerUser: {
    $username: "JohnDoe",
    $password: "password123",
    $email: "john@example.com",
    role: "user",
  },
  loginUser: {
    $username: "JohnDoe",
    $password: "password123",
  },
  createPost: {
    $title: "My New Post",
    $content: "This is the content of the post.",
    tags: ["tech", "news"],
  },
  updatePost: {
    title: "Updated Title",
    content: "Updated content.",
    tags: ["updated"],
  },
};

// Generate body parameter comment
export const swaggerBody = (description, schema) => {
  const schemaStr = JSON.stringify(schema, null, 2)
    .replace(/"(\w+)":/g, "$1:")
    .replace(/"/g, '"');

  return `/* #swagger.parameters['body'] = {
    in: 'body',
    description: '${description}',
    required: true,
    schema: ${schemaStr}
  } */`;
};
