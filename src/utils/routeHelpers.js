// Helper to create routes with automatic swagger config
export const createRoute = (method, path, handlers, options = {}) => {
  const { tag, security, bodySchema, bodyDescription } = options;
  
  let swaggerComments = "";
  
  if (tag) {
    swaggerComments += `/* #swagger.tags = ['${tag}'] */ `;
  }
  
  if (security) {
    swaggerComments += `/* #swagger.security = [{ "bearerAuth": [] }] */ `;
  }
  
  if (bodySchema) {
    const schemaStr = JSON.stringify(bodySchema, null, 2)
      .replace(/"(\w+)":/g, '$1:')
      .replace(/"/g, '"');
    swaggerComments += `/* #swagger.parameters['body'] = {
      in: 'body',
      description: '${bodyDescription || "Request body"}',
      required: true,
      schema: ${schemaStr}
    } */ `;
  }
  
  // Combine swagger comments with handlers
  return [swaggerComments.trim(), ...handlers];
};
