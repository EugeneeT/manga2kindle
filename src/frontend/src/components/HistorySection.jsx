// components/HistorySection.jsx
import React, { memo } from "react";
import PropTypes from "prop-types";
import { Trash2 } from "lucide-react";
import Card from "./common/Card";
import Button from "./common/Button";

/**
 * File status variants with styling
 */
const FILE_STATUS = {
  SUCCESS: "success",
  ERROR: "error",
};

/**
 * Individual file item component
 */
const FileItem = memo(({ file }) => {
  const statusColors =
    file.status === FILE_STATUS.ERROR
      ? "bg-red-100 dark:bg-red-900 dark:bg-opacity-20"
      : "bg-green-100 dark:bg-green-900 dark:bg-opacity-20";

  return (
    <div className={`p-3 rounded ${statusColors}`}>
      <div className="flex justify-between">
        <div>
          <span className="font-medium text-gray-900 dark:text-white">
            {file.seriesName || "Unknown Series"}
          </span>
          <span className="text-gray-600 dark:text-gray-400 ml-2">
            ({file.name})
          </span>
        </div>
        <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
          {new Date(file.processedAt).toLocaleString()}
        </span>
      </div>
    </div>
  );
});

FileItem.propTypes = {
  file: PropTypes.shape({
    name: PropTypes.string.isRequired,
    seriesName: PropTypes.string,
    processedAt: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
  }).isRequired,
};

/**
 * History section component that shows processing history and provides clear functionality
 * @param {Object} props - Component props
 * @returns {JSX.Element} History section
 */
const HistorySection = memo(({ files = [], onClearHistory }) => {
  return (
    <Card className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Processing History
        </h2>
        {files.length > 0 && (
          <Button onClick={onClearHistory} icon={<Trash2 size={16} />} />
        )}
      </div>

      {files.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">
          No processing history yet.
        </p>
      ) : (
        <div>
          <span className="text-sm text-gray-600 dark:text-gray-400 mb-4 block">
            {files.length} {files.length === 1 ? "item" : "items"} in history
          </span>

          <div className="space-y-2 h-80 overflow-y-auto pr-2 dark:scrollbar-thumb-gray-700 scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {files.map((file, index) => (
              <FileItem key={`file-${index}`} file={file} />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
});

HistorySection.propTypes = {
  files: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      seriesName: PropTypes.string,
      processedAt: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
    })
  ),
  onClearHistory: PropTypes.func.isRequired,
};

export default HistorySection;
