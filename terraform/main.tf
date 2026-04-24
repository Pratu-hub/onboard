terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
  subscription_id = var.subscription_id
}

data "azurerm_resource_group" "onboardiq" {
  name = var.resource_group_name
}

data "azurerm_container_registry" "onboardiq" {
  name                = var.acr_name
  resource_group_name = data.azurerm_resource_group.onboardiq.name
}

resource "azurerm_log_analytics_workspace" "onboardiq" {
  name                = "onboardiq-log-analytics"
  location            = data.azurerm_resource_group.onboardiq.location
  resource_group_name = data.azurerm_resource_group.onboardiq.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
}

resource "azurerm_cognitive_account" "doc_intelligence" {
  name                = "onboardiq-doc-intelligence"
  location            = data.azurerm_resource_group.onboardiq.location
  resource_group_name = data.azurerm_resource_group.onboardiq.name
  kind                = "FormRecognizer"
  sku_name            = "F0"
}
