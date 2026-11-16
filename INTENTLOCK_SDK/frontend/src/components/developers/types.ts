// INTENTLOCK 2.0 – Developer Portal Types & Interfaces

export type CalloutType = "info" | "warning" | "tip" | "danger";

export interface NavItem {
  title: string;
  href: string;
  badge?: string;
  isExternal?: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface TocItem {
  id: string;
  title: string;
  level?: 2 | 3;
}

export interface CodeTabItem {
  id: string;
  label: string;
  language: string;
  code: string;
}

export interface EndpointParameter {
  name: string;
  type: string;
  required?: boolean;
  description: string;
  location?: "header" | "query" | "path" | "body";
}

export interface EndpointCardProps {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  summary: string;
  auth: "Bearer Token" | "API Key" | "Public" | "Admin Only" | "Approver or Admin";
  description?: string;
  headers?: EndpointParameter[];
  parameters?: EndpointParameter[];
  requestBody?: {
    contentType: string;
    schema: string;
    example?: string;
  };
  responses: Array<{
    status: number;
    description: string;
    schema?: string;
    example?: string;
  }>;
}

export interface SearchDocItem {
  title: string;
  href: string;
  category: string;
  keywords: string[];
  summary: string;
}
