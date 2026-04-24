variable "subscription_id" {
  description = "Azure Subscription ID"
  type        = string
}

variable "resource_group_name" {
  description = "Azure Resource Group Name"
  type        = string
  default     = "OpenAI"
}

variable "location" {
  description = "Azure Region"
  type        = string
  default     = "Central India"
}

variable "acr_name" {
  description = "Azure Container Registry Name"
  type        = string
  default     = "onboardiqreg"
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "firebase_private_key" {
  description = "Firebase private key"
  type        = string
  sensitive   = true
}

variable "doc_intelligence_key" {
  description = "Document Intelligence Key"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT Secret"
  type        = string
  sensitive   = true
}

variable "registry_password" {
  description = "ACR Registry Password"
  type        = string
  sensitive   = true
}
