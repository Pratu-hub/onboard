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
