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
    ActiveRecord::Base.establish_connection(config)

    case ENV["LOG_LEVEL"]
    when "info"
      ActiveRecord::Base.logger.level = Logger::INFO
    else
      ActiveRecord::Base.logger.level = Logger::DEBUG
    end
  end
end
