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

resource "azurerm_container_app_environment" "onboardiq" {
  name                       = "onboardiq-env"
  location                   = data.azurerm_resource_group.onboardiq.location
  resource_group_name        = data.azurerm_resource_group.onboardiq.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.onboardiq.id
}

resource "azurerm_container_app" "backend" {
  name                         = "onboardiq-backend"
  container_app_environment_id = azurerm_container_app_environment.onboardiq.id
  resource_group_name          = data.azurerm_resource_group.onboardiq.name
  revision_mode                = "Single"

  template {
    container {
      name   = "backend"
      image  = "${data.azurerm_container_registry.onboardiq.login_server}/onboardiq-backend:latest"
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name  = "B2C_TENANT"
        value = var.b2c_tenant
      }
      env {
        name  = "B2C_CLIENT_ID"
        value = var.b2c_client_id
      }
      env {
        name  = "B2C_POLICY"
        value = var.b2c_policy
      }
      env {
        name  = "FRONTEND_URL"
        value = var.frontend_url
      }
      env {
        name  = "JWT_SECRET"
        value = var.jwt_secret
      }
      env {
        name  = "DB_PASSWORD"
        value = var.db_password
      }
    }
  }

  ingress {
    allow_insecure_connections = false
    external_enabled           = true
    target_port                = 3000
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }
}

output "backend_fqdn" {
  value = azurerm_container_app.backend.latest_revision_fqdn
}

