export const generateEntityIdExpression = (coId: string, prefix: string): string => {
  return `fn_gen_seq('${coId}', '${prefix}')`;
};
