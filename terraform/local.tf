provider "kubernetes" {
  config_path    = "~/.kube/config"
  config_context = "docker-desktop"
}

resource "kubernetes_namespace" "onboardiq" {
  metadata {
    name = "onboardiq"
  }
}

resource "kubernetes_secret" "backend_env" {
  metadata {
    name      = "backend-secrets"
    namespace = kubernetes_namespace.onboardiq.metadata[0].name
  }

  data = {
    "PORT" = "5000"
  }
}
