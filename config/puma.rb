workers workers Integer(ENV.fetch("WEB_CONCURRENCY", 1))
threads_count = Integer(ENV.fetch("MAX_THREADS", 2))
threads threads_count, threads_count

rackup DefaultRackup
port ENV.fetch("PORT", 3000)
environment ENV.fetch("RACK_ENV", "development")

worker_timeout Integer(ENV.fetch("PUMA_WORKER_TIMEOUT", 25))
worker_shutdown_timeout Integer(ENV.fetch("PUMA_WORKER_SHUTDOWN_TIMEOUT", 25))
preload_app!

@delayed_job_pid = nil

before_fork do
  # the following is highly recommended for Rails + "preload_app true"
  # as there's no need for the master process to hold a connection
  ActiveRecord::Base.connection.disconnect! if defined?(ActiveRecord::Base)

  @delayed_job_pid ||= spawn("bundle exec rake work_jobs") unless ENV["WORKER_EMBEDDED"] == "false"

  sleep 1
end

on_worker_boot do
  if defined?(ActiveRecord::Base)
    env = ENV["RACK_ENV"] || "development"
    config = YAML.safe_load(ERB.new(File.read("config/database.yml")).result)[env]
    ActiveRecord::Base.establish_connection(config)
  end
end

on_worker_shutdown do
  Process.kill("QUIT", @delayed_job_pid) if !ENV["RACK_ENV"] || ENV["RACK_ENV"] == "development"
end
