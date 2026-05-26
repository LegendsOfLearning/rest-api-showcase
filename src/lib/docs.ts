import { openApiOperationUrl } from "@/lib/api/reference";

export type ApiDocReference = {
  match: RegExp;
  method?: string;
  label: string;
  description?: string;
  docUrl: string;
};

export const DOC_REFERENCES: ApiDocReference[] = [
  {
    match: /^\/api\/users$/i,
    method: 'GET',
    label: 'List Users',
    description: 'Returns all users linked to your application.',
    docUrl: openApiOperationUrl('UsersController.index')
  },
  {
    match: /^\/api\/users$/i,
    method: 'POST',
    label: 'Create User',
    description: 'Creates or links a teacher or student.',
    docUrl: openApiOperationUrl('UsersController.create')
  },
  {
    match: /^\/api\/users\/login_link$/i,
    method: 'POST',
    label: 'Create Login Link',
    description: 'Generates a short-lived login link without assignments.',
    docUrl: openApiOperationUrl('UsersController.login_link')
  },
  {
    match: /^\/api\/assignments$/i,
    method: 'POST',
    label: 'Create Assignment',
    description: 'Creates an Awakening assignment for a teacher.',
    docUrl: openApiOperationUrl('AssignmentsController.create')
  },
  {
    match: /^\/api\/assignments\/[^/]+\/joins$/i,
    method: 'POST',
    label: 'Create Join Link',
    description: 'Generates a student join link for an assignment.',
    docUrl: openApiOperationUrl('AssignmentsController.join')
  },
  {
    match: /^\/api\/standard_sets$/i,
    method: 'GET',
    label: 'List Standard Sets',
    description: 'Returns available standard sets.',
    docUrl: openApiOperationUrl('StandardSetController.index')
  },
  {
    match: /^\/api\/standard_sets\/[^/]+\/standards$/i,
    method: 'GET',
    label: 'List Standards',
    description: 'Returns standards for a selected set.',
    docUrl: openApiOperationUrl('StandardsController.index')
  }
];

export function findDocReference(pathname: string, method: string): ApiDocReference | undefined {
  const normalizedMethod = method.toUpperCase();
  return DOC_REFERENCES.find((ref) => {
    const methodMatches = ref.method ? ref.method.toUpperCase() === normalizedMethod : true;
    return methodMatches && ref.match.test(pathname);
  });
}

/**
 * Generates a human-readable label from an API path and method.
 * This ensures every API call has a meaningful label, even if not in DOC_REFERENCES.
 */
export function generateApiLabel(pathname: string, method: string): string {
  const normalizedMethod = method.toUpperCase();
  const path = pathname.replace(/^\/api\/?/, '').replace(/\/$/, '');
  const parts = path.split('/').filter(Boolean);
  
  if (parts.length === 0) {
    return `${normalizedMethod} API`;
  }
  
  // Handle common patterns
  const resource = parts[0];
  const resourceName = resource
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  // Handle ID-based routes
  if (parts.length === 2 && /^\d+$/.test(parts[1])) {
    const id = parts[1];
    if (normalizedMethod === 'GET') {
      return `Get ${resourceName} #${id}`;
    } else if (normalizedMethod === 'PUT' || normalizedMethod === 'PATCH') {
      return `Update ${resourceName} #${id}`;
    } else if (normalizedMethod === 'DELETE') {
      return `Delete ${resourceName} #${id}`;
    }
  }
  
  // Handle nested resources
  if (parts.length >= 2) {
    const lastPart = parts[parts.length - 1];
    if (/^\d+$/.test(lastPart)) {
      const id = lastPart;
      const parentResource = parts[parts.length - 2]
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      const childResource = parts[parts.length - 3] || resourceName
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      if (normalizedMethod === 'GET') {
        return `Get ${childResource} for ${parentResource} #${id}`;
      }
    }
    const action = parts[parts.length - 1]
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    return `${normalizedMethod} ${action} (${resourceName})`;
  }
  
  // Default: method + resource name
  const actionMap: Record<string, string> = {
    'GET': 'Get',
    'POST': 'Create',
    'PUT': 'Update',
    'PATCH': 'Update',
    'DELETE': 'Delete',
  };
  
  const action = actionMap[normalizedMethod] || normalizedMethod;
  return `${action} ${resourceName}`;
}
