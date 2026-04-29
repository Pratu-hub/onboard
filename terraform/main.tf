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
  location            = var.location
  resource_group_name = data.azurerm_resource_group.onboardiq.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
}

resource "azurerm_container_app_environment" "onboardiq" {
  name                       = "onboardiq-env"
  location                   = var.location
  resource_group_name        = data.azurerm_resource_group.onboardiq.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.onboardiq.id
}

resource "azurerm_container_app" "backend" {
  name                         = "onboardiq-backend"
  container_app_environment_id = azurerm_container_app_environment.onboardiq.id
  resource_group_name          = data.azurerm_resource_group.onboardiq.name
  revision_mode                = "Single"

  secret {
    name  = "registry-password"
    value = var.registry_password
  }

  registry {
    server               = data.azurerm_container_registry.onboardiq.login_server
    username             = var.acr_name
    password_secret_name = "registry-password"
  }

  template {
    container {
      name   = "backend"
      image  = "${data.azurerm_container_registry.onboardiq.login_server}/onboardiq-backend:latest"
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name  = "PORT"
        value = "3001"
      }
      env {
        name  = "B2C_TENANT"
        value = var.b2c_tenant
      }
      env {
        name  = "B2C_CLIENT_ID"
        value = var.b2c_client_id
      }
      env {
        name  = "B2C_DIRECTORY_ID"
        value = "a0164170-e70e-42fe-98a6-e469d1a73851"
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
        name  = "DB_SERVER"
        value = "onboard-db.database.windows.net"
      }
      env {
        name  = "DB_DATABASE"
        value = "onboard"
      }
      env {
        name  = "DB_USER"
        value = "onboardadmin"
      }
      env {
        name  = "DB_PASSWORD"
        value = var.db_password
      }
      env {
        name  = "DB_PORT"
        value = "1433"
      }
      env {
        name  = "DB_ENCRYPT"
        value = "true"
      }
      env {
        name  = "FIREBASE_PROJECT_ID"
        value = "onboard-07"
      }
      env {
        name  = "FIREBASE_CLIENT_EMAIL"
        value = "firebase-adminsdk-fbsvc@onboard-07.iam.gserviceaccount.com"
      }
      env {
        name  = "FIREBASE_PRIVATE_KEY"
        value = var.firebase_private_key
      }
      env {
        name  = "FIREBASE_STORAGE_BUCKET"
        value = "onboard-07.firebasestorage.app"
      }
      env {
        name  = "AZURE_DOCUMENT_INTELLIGENCE_KEY"
        value = var.doc_intelligence_key
      }
      env {
        name  = "AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT"
        value = "https://doc-check.cognitiveservices.azure.com/"
      }
      env {
        name  = "AZURE_OPENAI_ENDPOINT"
        value = "https://onboard-ai.openai.azure.com/"
      }
      env {
        name  = "AZURE_OPENAI_KEY"
        value = var.openai_key
      }
      env {
        name  = "AZURE_OPENAI_DEPLOYMENT"
        value = "gpt-4o-mini"
      }
      env {
        name  = "APPLICATIONINSIGHTS_CONNECTION_STRING"
        value = azurerm_application_insights.onboardiq.connection_string
      }
    }
  }


  ingress {
    allow_insecure_connections = false
    external_enabled           = true
    target_port                = 3001
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }
}

resource "azurerm_container_app" "frontend" {
  name                         = "onboardiq-frontend"
  container_app_environment_id = azurerm_container_app_environment.onboardiq.id
  resource_group_name          = data.azurerm_resource_group.onboardiq.name
  revision_mode                = "Single"

  secret {
    name  = "registry-password"
    value = var.registry_password
  }

  registry {
    server               = data.azurerm_container_registry.onboardiq.login_server
    username             = var.acr_name
    password_secret_name = "registry-password"
  }

  template {
    container {
      name   = "frontend"
      image  = "${data.azurerm_container_registry.onboardiq.login_server}/onboardiq-frontend:latest"
      cpu    = 0.25
      memory = "0.5Gi"
    }
  }

  ingress {
    allow_insecure_connections = false
    external_enabled           = true
    target_port                = 80
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }
}

output "backend_fqdn" {
  value = azurerm_container_app.backend.latest_revision_fqdn
}

output "frontend_fqdn" {
  value = azurerm_container_app.frontend.latest_revision_fqdn
}

resource "azurerm_consumption_budget_resource_group" "onboardiq" {
  name              = "onboardiq-budget"
  resource_group_id = data.azurerm_resource_group.onboardiq.id
  amount            = 8000
  time_grain        = "Monthly"

  time_period {
    start_date = "2026-04-01T00:00:00Z"
    end_date   = "2027-04-01T00:00:00Z"
  }

  notification {
    enabled        = true
    threshold      = 90.0
    operator       = "EqualTo"
    contact_emails = [var.admin_email]
  }
}

resource "azurerm_application_insights" "onboardiq" {
  name                = "onboardiq-appinsights"
  location            = var.location
  resource_group_name = data.azurerm_resource_group.onboardiq.name
  workspace_id        = azurerm_log_analytics_workspace.onboardiq.id
  application_type    = "Node.JS"
}

output "app_insights_instrumentation_key" {
  value     = azurerm_application_insights.onboardiq.instrumentation_key
  sensitive = true
}

output "app_insights_connection_string" {
  value     = azurerm_application_insights.onboardiq.connection_string
  sensitive = true
}

data "azurerm_client_config" "current" {}

resource "azurerm_key_vault" "onboardiq" {
  name                        = "okv-${substr(var.subscription_id, 0, 8)}"
  location                    = var.location
  resource_group_name         = data.azurerm_resource_group.onboardiq.name
  enabled_for_disk_encryption = true
  tenant_id                   = data.azurerm_client_config.current.tenant_id
  soft_delete_retention_days  = 7
  purge_protection_enabled    = false

  sku_name = "standard"

  access_policy {
    tenant_id = data.azurerm_client_config.current.tenant_id
    object_id = data.azurerm_client_config.current.object_id

    secret_permissions = [
      "Get", "List", "Set", "Delete", "Purge", "Recover"
    ]
  }
}

resource "azurerm_key_vault_secret" "db_password" {
  name         = "db-password"
  value        = var.db_password
  key_vault_id = azurerm_key_vault.onboardiq.id
}

resource "azurerm_key_vault_secret" "doc_intelligence_key" {
  name         = "doc-intelligence-key"
  value        = var.doc_intelligence_key
  key_vault_id = azurerm_key_vault.onboardiq.id
}

resource "azurerm_key_vault_secret" "openai_key" {
  name         = "openai-key"
  value        = var.openai_key
  key_vault_id = azurerm_key_vault.onboardiq.id
}

resource "azurerm_key_vault_secret" "firebase_private_key" {
  name         = "firebase-private-key"
  value        = var.firebase_private_key
  key_vault_id = azurerm_key_vault.onboardiq.id
}

resource "azurerm_key_vault_secret" "registry_password" {
  name         = "registry-password"
  value        = var.registry_password
  key_vault_id = azurerm_key_vault.onboardiq.id
}

resource "azurerm_key_vault_secret" "jwt_secret" {
  name         = "jwt-secret"
  value        = var.jwt_secret
  key_vault_id = azurerm_key_vault.onboardiq.id
}


