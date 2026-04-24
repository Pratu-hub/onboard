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
