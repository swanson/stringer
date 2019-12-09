worker_processes 1
timeout 30
preload_app true

@delayed_job_pid = nil

before_fork do |_server, _worker|
  # the following is highly recommended for Rails + "preload_app true"
  # as there's no need for the master process to hold a connection
  ActiveRecord::Base.connection.disconnect! if defined?(ActiveRecord::Base)

  @delayed_job_pid ||= spawn("bundle exec rake work_jobs") unless ENV["WORKER_EMBEDDED"] == "false"

  sleep 1
end

after_fork do |_server, _worker|
  if defined?(ActiveRecord::Base)
    env = ENV["RACK_ENV"] || "development"
    config = if ENV["DATABASE_URL"]
               ENV["DATABASE_URL"]
             else
               YAML.load(ERB.new(File.read("config/database.yml")).result)[env]
             end
    level = if ENV["LOG_LEVEL"] == "info"
              Logger::INFO
            else
              Logger::DEBUG
            end

    ActiveRecord::Base.establish_connection(config)
    ActiveRecord::Base.logger.level = level
  end
end

after_worker_exit do |_server, _worker, _status|
  Process.kill("QUIT", @delayed_job_pid) if !ENV["RACK_ENV"] || ENV["RACK_ENV"] == "development"
end
