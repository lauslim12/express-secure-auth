import defaultJoi from 'joi';

const joi = defaultJoi.defaults((schema) =>
  schema.options({
    abortEarly: true,
    convert: true,
    stripUnknown: true,
    errors: { escapeHtml: true },
  })
);

export default joi;
